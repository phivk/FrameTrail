<?php

require_once("./config.php");
require_once("./user.php");
include_once("./opengraph.php");

/**
 * @param $type
 * @param $name
 * @param $description
 * @param $attributes
 * @param $files
 * @param $lat
 * @param $lon
 * @param $boundingBox
 * @return mixed
 *
 * Returning Code:
 *     0       =   Success. In $return["response"]["resource"] will the new JSON be returned. In $return["response"]["resId"] you can find the new ID
 *     1       =   failed. User is not logged in or not activated.
 *     3       =   failed. Could not find the resources folder
 *     4       =   failed. File type expected but file wasn't transferred.
 *     5       =   failed. No video file transferred.
 *     6       =   failed. File format not supported (FFmpeg unavailable for transcoding).
 *     7       =   failed. Type "map" was expected but $lat or $lon aren't sent.
 *     8       =   failed. $type or $name have not been transferred.
 *     9       =   failed. $type was wrong or file type not recognized.
 *     10      =   failed. File size too big.
 *     11      =   failed. Type "url" was expected but url is empty.
 *     20      =   failed. Uploads not allowed in config.
 */
function fileUpload($type, $name, $description="", $attributes, $files, $lat, $lon, $boundingBox) {
    global $conf;

    if ($err = requireLogin()) return $err;

    if (!is_dir($conf["dir"]["data"]."/resources")) {
        $return["status"] = "fail";
        $return["code"] = 3;
        $return["string"] = "Could not find the resources folder";
        return $return;
    }

    if ((!$type) || (!$name) || ($name == "")) {
        $return["status"] = "fail";
        $return["code"] = 8;
        $return["string"] = "Name or Type have not been submitted.";
        return $return;
    }

    if (!$attributes) {
        $attributes = new ArrayObject();
    }

    // If a unified file upload is present, auto-detect type from MIME type
    if (!empty($files["file"]) && $files["file"]["size"] > 0) {
        $uploadedMime = $files["file"]["type"];
        $uploadedName = strtolower($files["file"]["name"]);

        if (strpos($uploadedMime, 'image/') === 0 || preg_match('/\.(jpg|jpeg|png|gif)$/', $uploadedName)) {
            $type = 'image';
        } elseif ($uploadedMime === 'application/pdf' || preg_match('/\.pdf$/', $uploadedName)) {
            $type = 'pdf';
        } elseif (strpos($uploadedMime, 'video/') === 0 || preg_match('/\.(mp4|mov|avi|webm|m4v|mkv|flv)$/', $uploadedName)) {
            $type = 'video';
        } elseif (strpos($uploadedMime, 'audio/') === 0 || preg_match('/\.(mp3|wav|ogg|m4a|aac)$/', $uploadedName)) {
            $type = 'audio';
        } else {
            $return["status"] = "fail";
            $return["code"] = 9;
            $return["string"] = "Unsupported file type: " . $uploadedMime;
            return $return;
        }
    }

    // Check allowUploads for file types
    $configjson = file_get_contents($conf["dir"]["data"]."/config.json");
    $configDB = json_decode($configjson, true);
    $uploadsAllowed = $configDB["allowUploads"];

    if (in_array($type, ['image', 'pdf', 'audio', 'video']) && $uploadsAllowed === false) {
        $return["status"] = "fail";
        $return["code"] = 20;
        $return["string"] = "User not allowed to upload files";
        return $return;
    }

    $cTime = time();
    $newResource["name"] = $name;
    $newResource["creator"] = (string)$_SESSION["ohv"]["user"]["name"];
    $newResource["creatorId"] = (string)$_SESSION["ohv"]["user"]["id"];
    $newResource["created"] = (int)$cTime;
    $newResource["description"] = $description;

    switch ($type) {
        case "url":
            $urlAttr = json_decode($attributes, true);
            if (!$urlAttr["src"] || $urlAttr["src"] == "") {
                $return["status"] = "fail";
                $return["code"] = 11;
                $return["string"] = "Empty field: URL.";
                return $return;
            }
            $newResource["src"] = $urlAttr["src"];
            $newResource["type"] = $urlAttr["type"];
            $newResource["attributes"] = $urlAttr["attributes"];
            $newResource["thumb"] = $urlAttr["thumb"];
        break;

        case "image":
            $uploadedFile = !empty($files["file"]) ? $files["file"] : null;
            if (!$uploadedFile || !$uploadedFile["size"]) {
                $return["status"] = "fail";
                $return["code"] = 4;
                $return["string"] = "No image file to upload";
                return $return;
            }

            $sizeValidation = validateFileSize($uploadedFile["size"]);
            if (!$sizeValidation['valid']) {
                $return["status"] = "fail";
                $return["code"] = 10;
                $return["string"] = $sizeValidation['error'];
                return $return;
            }

            $fileparts = preg_split("/\./", $uploadedFile["name"]);
            $filetype = array_pop($fileparts);
            $filename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_".sanitize($name), 0, 90).".".$filetype;
            $finalPath = $conf["dir"]["data"]."/resources/".$filename;
            $tempPath = $uploadedFile["tmp_name"];

            // Optimize source file if GD is available
            if (extension_loaded('gd')) {
                $optimizeResult = optimizeImage($tempPath, $finalPath, 1920, 85);
                if (isset($optimizeResult['error'])) {
                    error_log('FrameTrail: Image optimization failed: '.$optimizeResult['error'].', saving original');
                    move_uploaded_file($tempPath, $finalPath);
                }
                // Generate server-side thumbnail as fallback only when client provided none
                if (empty($_REQUEST["thumb"])) {
                    $thumbFilename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_thumb_".sanitize($name), 0, 90).".png";
                    $thumbResult = generateThumbnail($finalPath, $conf["dir"]["data"]."/resources/".$thumbFilename);
                    if (!isset($thumbResult['error'])) {
                        $newResource["thumb"] = $thumbFilename;
                    }
                }
            } else {
                move_uploaded_file($tempPath, $finalPath);
            }

            $newResource["src"] = $filename;
            $newResource["type"] = "image";
            $newResource["attributes"] = [];
        break;

        case "pdf":
            $uploadedFile = !empty($files["file"]) ? $files["file"] : null;
            if (!$uploadedFile || !$uploadedFile["size"]) {
                $return["status"] = "fail";
                $return["code"] = 4;
                $return["string"] = "No PDF file to upload";
                return $return;
            }

            $sizeValidation = validateFileSize($uploadedFile["size"]);
            if (!$sizeValidation['valid']) {
                $return["status"] = "fail";
                $return["code"] = 10;
                $return["string"] = $sizeValidation['error'];
                return $return;
            }

            $fileparts = preg_split("/\./", $uploadedFile["name"]);
            $filetype = array_pop($fileparts);
            $filename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_".sanitize($name), 0, 90).".".$filetype;
            move_uploaded_file($uploadedFile["tmp_name"], $conf["dir"]["data"]."/resources/".$filename);
            $newResource["src"] = $filename;
            $newResource["type"] = "pdf";
            $newResource["attributes"] = [];
        break;

        case "audio":
            $uploadedFile = !empty($files["file"]) ? $files["file"] : null;
            if (!$uploadedFile || !$uploadedFile["size"]) {
                $return["status"] = "fail";
                $return["code"] = 4;
                $return["string"] = "No audio file to upload";
                return $return;
            }

            $sizeValidation = validateFileSize($uploadedFile["size"]);
            if (!$sizeValidation['valid']) {
                $return["status"] = "fail";
                $return["code"] = 10;
                $return["string"] = $sizeValidation['error'];
                return $return;
            }

            $filename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_".sanitize($name), 0, 90).".mp3";
            $finalPath = $conf["dir"]["data"]."/resources/".$filename;
            $uploadedMime = $uploadedFile["type"];
            $needsTranscoding = !in_array($uploadedMime, ["audio/mp3", "audio/mpeg"]);

            if ($needsTranscoding) {
                $ffmpegPath = detectFFmpegPath();
                if (!$ffmpegPath) {
                    $return["status"] = "fail";
                    $return["code"] = 6;
                    $return["string"] = "Wrong audio file format. Only MP3 is supported. FFmpeg is not available on this server for transcoding other formats.";
                    return $return;
                }
                $transcodeResult = transcodeAudioToMP3($uploadedFile["tmp_name"], $finalPath, 192);
                if (isset($transcodeResult['error'])) {
                    $return["status"] = "fail";
                    $return["code"] = 6;
                    $return["string"] = "Audio transcoding failed: ".$transcodeResult['error'];
                    return $return;
                }
                error_log('FrameTrail: Audio transcoded to MP3');
            } else {
                move_uploaded_file($uploadedFile["tmp_name"], $finalPath);
            }

            $newResource["src"] = $filename;
            $newResource["type"] = "audio";
            $newResource["attributes"] = [];
        break;

        case "video":
            $uploadedFile = !empty($files["file"]) ? $files["file"] : null;
            if (!$uploadedFile || !$uploadedFile["size"]) {
                $return["status"] = "fail";
                $return["code"] = 5;
                $return["string"] = "No video file to upload";
                return $return;
            }

            $sizeValidation = validateFileSize($uploadedFile["size"]);
            if (!$sizeValidation['valid']) {
                $return["status"] = "fail";
                $return["code"] = 10;
                $return["string"] = $sizeValidation['error'];
                return $return;
            }

            $filename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_".sanitize($name), 0, 90);
            $finalPath = $conf["dir"]["data"]."/resources/".$filename.".mp4";
            $uploadedMime = $uploadedFile["type"];
            $needsTranscoding = !in_array($uploadedMime, ["video/mp4", "video/mpeg4"]);

            if ($needsTranscoding) {
                $ffmpegPath = detectFFmpegPath();
                if (!$ffmpegPath) {
                    $return["status"] = "fail";
                    $return["code"] = 6;
                    $return["string"] = "Wrong video file format. Only MP4 is supported. FFmpeg is not available on this server for transcoding other formats.";
                    return $return;
                }
                $transcodeResult = transcodeVideoToMP4($uploadedFile["tmp_name"], $finalPath, 1920);
                if (isset($transcodeResult['error'])) {
                    $return["status"] = "fail";
                    $return["code"] = 6;
                    $return["string"] = "Video transcoding failed: ".$transcodeResult['error'];
                    return $return;
                }
                error_log('FrameTrail: Video transcoded to MP4');
            } else {
                move_uploaded_file($uploadedFile["tmp_name"], $finalPath);
            }

            // Generate server-side video thumbnail only when client did not provide one
            // (client cannot generate thumbnails for non-MP4 formats that required transcoding)
            if (empty($_REQUEST["thumb"])) {
                $thumbFilename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_thumb_".sanitize($name), 0, 90).".png";
                $thumbPath = $conf["dir"]["data"]."/resources/".$thumbFilename;
                $thumbResult = generateVideoThumbnail($finalPath, $thumbPath);
                if (!isset($thumbResult['error'])) {
                    $newResource["thumb"] = $thumbFilename;
                    error_log('FrameTrail: Video thumbnail generated: '.$thumbFilename);
                }
            }

            $newResource["src"] = $filename.".mp4";
            $newResource["type"] = "video";
            $newResource["attributes"] = [];

            // Handle subtitle files if provided
            if (!empty($files["subtitles"]["name"]) && is_array($files["subtitles"]["name"])) {
                foreach ($files["subtitles"]["name"] as $k => $v) {
                    $subparts = preg_split("/\./", $v);
                    $subtype = array_pop($subparts);
                    $subFilename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_".sanitize($name), 0, 90)."_sub_".$k.".".$subtype;
                    move_uploaded_file($files["subtitles"]["tmp_name"][$k], $conf["dir"]["data"]."/resources/".$subFilename);
                    $newResource["subtitles"][$k] = $subFilename;
                }
            }
        break;

        case "map":
            if ((!$lat) || (!$lon)) {
                $return["status"] = "fail";
                $return["code"] = 7;
                $return["string"] = "Lat or Lon are missing";
                return $return;
            }
            $newResource["type"] = "location";
            $newResource["src"] = "";
            $newResource["attributes"] = [
                "lat" => $lat,
                "lon" => $lon,
                "boundingBox" => $boundingBox ?: []
            ];
        break;

        default:
            $return["status"] = "fail";
            $return["code"] = 9;
            $return["string"] = "Type was not correct";
            return $return;
        break;
    }

    // Save client-provided thumbnail inline (overrides any server-generated thumb)
    // Client generates thumbnails for: images, MP4 video, PDFs (via PDF.js)
    if (!empty($_REQUEST["thumb"]) && in_array($type, ['image', 'pdf', 'audio', 'video'])) {
        $thumbData = preg_replace('/^data:image\/\w+;base64,/', '', $_REQUEST["thumb"]);
        $decodedThumb = base64_decode($thumbData);
        if ($decodedThumb !== false && strlen($decodedThumb) > 0) {
            $thumbFilename = substr($_SESSION["ohv"]["user"]["id"]."_".$cTime."_thumb_".sanitize($name), 0, 90).".png";
            file_put_contents($conf["dir"]["data"]."/resources/".$thumbFilename, $decodedThumb);
            $newResource["thumb"] = $thumbFilename;
        }
    }

    $file = new sharedFile($conf["dir"]["data"]."/resources/_index.json");
    $json = $file->read();
    $res = json_decode($json, true);
    if (!$res["resources-increment"]) {
        $res["resources-increment"] = 0;
    }
    $res["resources-increment"]++;
    $res["resources"][$res["resources-increment"]] = $newResource;
    $file->writeClose(json_encode($res, $conf["settings"]["json_flags"]));

    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "File saved.";
    $return["response"]["resource"] = $newResource;
    $return["response"]["resId"] = $res["resources-increment"];
    return $return;
}

/**
 * @param $resourcesID
 * @param $thumb
 * @return mixed
 *
 * Returning Code:
 * 0       =   Success. In $return["response"] will the full object of the manipulated resource be returned.
 * 1       =   failed. User is not logged in or not activated.
 * 3       =   failed. Could not find the resources folder
 * 4       =   failed. resourcesID or thumb are not transferred
 * 5       =   failed. No valid resourcesID
 * 6       =   failed. Not permitted. It's not your resource and you're not an admin!
 */
function fileUploadThumb($resourcesID,$thumb) {
    global $conf;

    if ($err = requireLogin()) return $err;

    if (!is_dir($conf["dir"]["data"]."/resources")) {
        $return["status"] = "fail";
        $return["code"] = 3;
        $return["string"] = "Could not find the resources folder";
        return $return;
    }

    if ((!$resourcesID) || (!$thumb) || ($thumb == "")) {
        $return["status"] = "fail";
        $return["code"] = 4;
        $return["string"] = "resourcesID or thumb are not transferred";
        return $return;
    }
    $file = new sharedFile($conf["dir"]["data"]."/resources/_index.json");
    $json = $file->read();
    $res = json_decode($json,true);
    if (!is_array($res["resources"][$resourcesID])) {
        $return["status"] = "fail";
        $return["code"] = 5;
        $return["string"] = "No valid resourcesID";
        $return["response"] = $res;
        $file->close();
        return $return;
    }
    if (($res["resources"][$resourcesID]["creatorId"] != $_SESSION["ohv"]["user"]["id"]) && ($_SESSION["ohv"]["user"]["role"] != "admin")) {
        $return["status"] = "fail";
        $return["code"] = 6;
        $return["string"] = "Not permitted. It's not your resource and you're not an admin!";
        $file->close();
        return $return;
    }
    $thumb = str_replace('data:image/png;base64,', '', $thumb);
    //$_REQUEST["thumb"] = str_replace(' ', '+', $_REQUEST["thumb"]);
    //echo $_REQUEST["thumb"];
    $data = base64_decode($thumb);

    $filename = substr($_SESSION["ohv"]["user"]["id"]."_".$res["resources"][$resourcesID]["created"]."_thumb_".sanitize($res["resources"][$resourcesID]["name"]),0,90);
    file_put_contents($conf["dir"]["data"]."/resources/".$filename.".png", $data);

    $res["resources"][$resourcesID]["thumb"] = $filename.".png";
    $file->writeClose(json_encode($res, $conf["settings"]["json_flags"]));
    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "thumb saved";
    $return["response"] = $res["resources"][$resourcesID];
    return $return;
}

/**
 * @param $resourcesID
 * @return mixed
 *
 * Returning Code:
 * 0       =   Success. Resource and its thumbnails have been deleted.
 * 1       =   failed. User is not logged in or is inactive
 * 2       =   failed. Could not find resources database (json)
 * 3       =   failed. resourcesID was not found. Missing or wrong ID
 * 4       =   failed. Not permitted. It's not your resource and you're not an admin!
 * 5       =   failed. Resource is in use. Check out $return["used"] for details
 */
function fileDelete($resourcesID) {
    global $conf;
    if ($err = requireLogin()) return $err;

    if (!file_exists($conf["dir"]["data"]."/resources/_index.json")) {
        $return["status"] = "fail";
        $return["code"] = 2;
        $return["string"] = "Could not find resources database";
        return $return;
    }
    $file = new sharedFile($conf["dir"]["data"]."/resources/_index.json");
    $json = $file->read();
    $res = json_decode($json,true);
    if (!$res["resources"][$resourcesID]) {
        $return["status"] = "fail";
        $return["code"] = 3;
        $return["string"] = "No valid resourcesID";
        $file->close();
        return $return;
    }
    if (($res["resources"][$resourcesID]["creatorId"] != $_SESSION["ohv"]["user"]["id"]) && ($_SESSION["ohv"]["user"]["role"] != "admin")) {
        $return["status"] = "fail";
        $return["code"] = 4;
        $return["string"] = "Not permitted. It's not your resource and you're not an admin!";
        $file->close();
        return $return;
    }


    $json = file_get_contents($conf["dir"]["data"]."/hypervideos/_index.json");
    $hv = json_decode($json,true);
    $usedcnt = 0;
    $used = array();
    foreach ($hv["hypervideos"] as $hvk=>$hvc) {
        $hvannotationJson = file_get_contents($conf["dir"]["data"]."/hypervideos/".$hvk."/annotations/_index.json");
        $hvannotationIndex = json_decode($hvannotationJson,true);
        foreach ($hvannotationIndex["annotationfiles"] as $hvak=>$hvac) {
            $hvannotationFileJson = file_get_contents($conf["dir"]["data"]."/hypervideos/".$hvk."/annotations/".$hvak.".json");
            $hvannotationFile = json_decode($hvannotationFileJson,true);
            foreach ($hvannotationFile as $hvannotationFileItem) {
                
                if ($hvannotationFileItem["body"]["frametrail:resourceId"] == $resourcesID) {
                    $usedcnt++;
                    $tmp = array();
                    $tmp["hypervideoId"] = $hvk;
                    $tmp["annotationfilesId"] = $hvak;
                    $tmp["annotationfilesName"] = $hvac["name"];
                    $tmp["type"] = "annotationsfile";
                    $tmp["owner"] = $hvac["owner"];
                    $tmp["ownerId"] = $hvac["ownerId"];
                    array_push($used, $tmp);
                }
                
            }
        }
        
        $hvJson = file_get_contents($conf["dir"]["data"]."/hypervideos/".$hvk."/hypervideo.json");
        $hvIndex = json_decode($hvJson,true);
        foreach ($hvIndex["contents"] as $hvcontentsKey=>$hvcontentsVal) {
            if ($hvcontentsVal["body"]["frametrail:resourceId"] == $resourcesID) {
                $usedcnt++;
                $tmp = array();
                $tmp["hypervideoId"] = $hvk;
                $tmp["type"] = $hvcontentsVal["frametrail:type"];
                $tmp["owner"] = $hvcontentsVal["creator"]["nickname"];
                $tmp["ownerId"] = $hvcontentsVal["creator"]["id"];
                array_push($used, $tmp);
            }
        }
        foreach ($hvIndex["clips"] as $hvclipsKey=>$hvclipsVal) {
            if ($hvclipsVal["resourceId"] == $resourcesID) {
                $usedcnt++;
                $tmp = array();
                $tmp["hypervideoId"] = $hvk;
                $tmp["type"] = "clip";
                $tmp["obj"] = $hvclipsVal;
                array_push($used, $tmp);
            }
        }
        
        
    }
    
    
    if ($usedcnt > 0) {
        $return["status"] = "fail";
        $return["code"] = 5;
        $return["string"] = "Resource is used";
        $return["usedCount"] = $usedcnt;
        $return["used"] = $used;
        $file->close();
        return $return;
    }

    if ($res["resources"][$resourcesID]["type"] == "video") {
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"]);
        }
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"]);
        }
    } else if ($res["resources"][$resourcesID]["type"] == "image") {
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"]);
        }
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"]);
        }
    } else if ($res["resources"][$resourcesID]["type"] == "pdf") {
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["src"]);
        }
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"]);
        }
    } else {
        if (file_exists($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"])) {
            unlink($conf["dir"]["data"]."/resources/".$res["resources"][$resourcesID]["thumb"]);
        }
    }
    unset($res["resources"][$resourcesID]);
    $file->writeClose(json_encode($res, $conf["settings"]["json_flags"]));
    //$file->close();
    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "Resource deleted";
    return $return;
}

/**
 * @param $resourcesID
 * @param $name
 * @param $licenseType
 * @param $licenseAttribution
 * @return mixed
 *
 * Returning Code:
 * 0       =   Success. Resource has been updated
 * 1       =   failed. Not logged in
 * 2       =   failed. Could not find resources database
 * 3       =   failed. No valid resourcesID
 * 4       =   failed. Not permitted
 */
function fileUpdate($resourcesID, $name, $licenseType, $licenseAttribution) {
    global $conf;
    if ($err = requireLogin()) return $err;

    if (!file_exists($conf["dir"]["data"]."/resources/_index.json")) {
        $return["status"] = "fail";
        $return["code"] = 2;
        $return["string"] = "Could not find resources database";
        return $return;
    }
    $file = new sharedFile($conf["dir"]["data"]."/resources/_index.json");
    $json = $file->read();
    $res = json_decode($json, true);
    if (!$res["resources"][$resourcesID]) {
        $return["status"] = "fail";
        $return["code"] = 3;
        $return["string"] = "No valid resourcesID";
        $file->close();
        return $return;
    }
    if (($res["resources"][$resourcesID]["creatorId"] != $_SESSION["ohv"]["user"]["id"]) && ($_SESSION["ohv"]["user"]["role"] != "admin")) {
        $return["status"] = "fail";
        $return["code"] = 4;
        $return["string"] = "Not permitted. It's not your resource and you're not an admin!";
        $file->close();
        return $return;
    }

    $res["resources"][$resourcesID]["name"] = $name;
    $res["resources"][$resourcesID]["licenseType"] = $licenseType;
    $res["resources"][$resourcesID]["licenseAttribution"] = $licenseAttribution;

    $file->writeClose(json_encode($res, $conf["settings"]["json_flags"]));
    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "Resource updated";
    $return["resource"] = $res["resources"][$resourcesID];
    return $return;
}

/**
 * @param $key
 * @param $condition
 * @param $values
 * @return mixed
 *
 * Returning Code:
 * 0       =   Success. Resources matching the filter have been found
 * 1       =   failed. Missing parameter
 */
function fileGetByFilter($key,$condition,$values) {
    global $conf;
    if ((!$key) || (!$condition) || (!$values)) {
        $return["status"] = "fail";
        $return["code"] = 1;
        $return["string"] = "Parameter missing!";
        return $return;
    }
    // allow string as values param
    if (is_string($values)) {
        $values = array($values);
    }
    $json = file_get_contents($conf["dir"]["data"]."/resources/_index.json");
    $res = json_decode($json,true);
    $return["result"] = Array();
    $return["resultCount"] = 0;
    foreach ($res["resources"] as $k=>$v) {
        $map = array(
            "==" => in_array($v[$key],$values),
            "!=" => !in_array($v[$key],$values),
            "<=" => $v[$key] <= $values[0],
            ">=" => $v[$key] >= $values[0],
            "contains" => array_search($v[$key], $values) !== false
        );
        if ($map[$condition]) {
            $return["result"][$k] = $v;
            $return["resultCount"]++;
        }
    }
    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "see result";
    return $return;
}

/**
 * @param $url
 * @return mixed
 *
 * Returning Code:
 * 0       =   Success. URL info successfully retrieved
 * 1       =   failed.
 */
function fileGetUrlInfo($url) {
    
    $siteInfo = OpenGraph::fetch($url);

    stream_context_set_default( [
      'ssl' => [
          'verify_peer' => false,
          'verify_peer_name' => false,
      ],
    ]);
    $headers = get_headers($url, 1);

    if (isset($headers["X-Frame-Options"])) {
        if (is_array($headers["X-Frame-Options"])) {
            end($headers["X-Frame-Options"]);
            $xFrameResult = current($headers["X-Frame-Options"]);
            reset($headers["X-Frame-Options"]);
        } else {
            $xFrameResult = $headers["X-Frame-Options"];
        }
    }

    $xFrameResult = strtolower((string)$xFrameResult);

    if ( $xFrameResult == 'sameorigin' || $xFrameResult == 'deny' || $siteInfo["status"] == "error" ) {
        $return["embed"] = "forbidden";
    } else {
        $return["embed"] = "allowed";
    }

    if ($siteInfo["status"] == "error") {
        $return["status"] = "error";
        $return["code"] = 1;
        $return["string"] = $siteInfo["string"];
        $return["urlInfo"] = false;
        return $return;
    } else {
        
        if (isAbsoluteUrl($siteInfo["result"]->image)) {
            $imagePath = $siteInfo["result"]->image;
        } else {
            $urlResult = parse_url($url);
            $imagePath = ($siteInfo["result"]->image) ? $urlResult['scheme']."://".$urlResult['host']."/".$siteInfo["result"]->image : null;
        }

        $return["status"] = "success";
        $return["code"] = 0;
        $return["string"] = "URL Info successfully retrieved";
        $return["urlInfo"] = Array();
        $return["urlInfo"]["title"] = $siteInfo["result"]->title;
        $return["urlInfo"]["image"] = $imagePath;
        $return["urlInfo"]["description"] = $siteInfo["result"]->description;
        return $return;
    }
}


function isAbsoluteUrl($url) {
    $pattern = "/^(?:ftp|https?|file)?:?\/\/(?:(?:(?:[\w\.\-\+!$&'\(\)*\+,;=]|%[0-9a-f]{2})+:)*
    (?:[\w\.\-\+%!$&'\(\)*\+,;=]|%[0-9a-f]{2})+@)?(?:
    (?:[a-z0-9\-\.]|%[0-9a-f]{2})+|(?:\[(?:[0-9a-f]{0,4}:)*(?:[0-9a-f]{0,4})\]))(?::[0-9]+)?(?:[\/|\?]
    (?:[\w#!:\.\?\+\|=&@$'~*,;\/\(\)\[\]\-]|%[0-9a-f]{2})*)?$/xi";

    return (bool) preg_match($pattern, $url);
}


/**
 *
 * Returns a file size limit in bytes based on the PHP upload_max_filesize and post_max_size
 * Credits: Drupal Developers, GPL license v2 or later
 *
 * @return int
 *
 */
function fileGetMaxUploadSize() {
    global $conf;

    static $max_size = -1;

    if ($max_size < 0) {
        // Start with post_max_size.
        $max_size = parse_size(ini_get('post_max_size'));

        // If upload_max_size is less, then reduce. Except if upload_max_size is
        // zero, which indicates no limit.
        $upload_max = parse_size(ini_get('upload_max_filesize'));
        if ($upload_max > 0 && $upload_max < $max_size) {
            $max_size = $upload_max;
        }
    }

    $return["maxuploadbytes"] = $max_size;
    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "Max Upload Bytes received";
    return $return;
}

/**
 * Get server capabilities: max upload size and FFmpeg availability.
 * FFmpeg is auto-detected at runtime — no config flag needed.
 *
 * @return array Capabilities response
 */
function fileGetCapabilities() {
    $max_size = parse_size(ini_get('post_max_size'));
    $upload_max = parse_size(ini_get('upload_max_filesize'));
    if ($upload_max > 0 && $upload_max < $max_size) {
        $max_size = $upload_max;
    }

    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "Capabilities retrieved";
    $return["maxUploadBytes"] = $max_size;
    $return["ffmpegAvailable"] = (detectFFmpegPath() !== null);
    return $return;
}

function parse_size($size) {
    $unit = preg_replace('/[^bkmgtpezy]/i', '', $size); // Remove the non-unit characters from the size.
    $size = preg_replace('/[^0-9\.]/', '', $size); // Remove the non-numeric characters from the size.
    
    if ($unit) {
        // Find the position of the unit in the ordered string which is the power of magnitude to multiply a kilobyte by.
        return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
    } else {
        return round($size);
    }
}

/**
 * @param $configstring
 * @return mixed
 *
 * Returning Code:
 * 0    =   Success. Config file saved.
 * 1    =   failed. User is not logged in or is inactive or not admin (see resp["string"])
 * 2    =   failed. Config file not found or not writable
 * 3    =   failed. Config string must be > 3 characters
 *
 */
function updateConfigFile($configstring) {
    
    global $conf;
    if ($err = requireLogin("admin")) return $err;

    if (!is_writable($conf["dir"]["data"]."/config.json")) {
        $return["status"] = "fail";
        $return["code"] = 2;
        $return["string"] = "Config file (config.json) not writable.";
        return $return;
    }

    if ((strlen($_REQUEST["src"]) <3)) {
        $return["status"] = "fail";
        $return["code"] = 3;
        $return["string"] = "Config string length must be > 3 characters.";
        return $return;
    }

    $file = new sharedFile($conf["dir"]["data"]."/config.json");
    $src = json_decode($configstring, true);
    $jsonsrc = json_encode($src,$conf["settings"]["json_flags"]);
    $file->writeClose($jsonsrc);

    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "Config successfully saved.";
    return $return;
}

/**
 * @param $cssstring
 * @return mixed
 *
 * Returning Code:
 * 0    =   Success. CSS file saved.
 * 1    =   failed. User is not logged in or is inactive or not admin (see resp["string"])
 * 2    =   failed. CSS file not found or not writable
 *
 */
function updateCSSFile($cssstring) {
    
    global $conf;
    if ($err = requireLogin("admin")) return $err;

    if (!is_writable($conf["dir"]["data"]."/custom.css")) {
        $return["status"] = "fail";
        $return["code"] = 2;
        $return["string"] = "CSS file (custom.css) not writable.";
        return $return;
    }

    $file = new sharedFile($conf["dir"]["data"]."/custom.css");
    $file->writeClose($cssstring);

    $return["status"] = "success";
    $return["code"] = 0;
    $return["string"] = "CSS file successfully saved.";
    return $return;
}

/**
 * Optimize an uploaded image
 * - Resize if larger than maxWidth
 * - Compress to specified quality
 * - Preserve format (JPEG, PNG, GIF)
 *
 * @param string $sourcePath Path to source image
 * @param string $destPath Path to save optimized image
 * @param int $maxWidth Maximum width (default 1920)
 * @param int $quality JPEG quality 0-100 (default 85), PNG compression 0-9 (default 6)
 * @return array Success/error response
 */
function optimizeImage($sourcePath, $destPath, $maxWidth = 1920, $quality = 85) {
    global $conf;

    // Check if GD library is available
    if (!function_exists('imagecreatefromjpeg')) {
        error_log('FrameTrail: GD library not available for image optimization');
        return ['error' => 'GD library not available'];
    }

    // Get image info
    $imageInfo = @getimagesize($sourcePath);
    if (!$imageInfo) {
        return ['error' => 'Invalid image file'];
    }

    $sourceImage = null;
    $imageType = $imageInfo['mime'];

    // Load source image based on type
    switch ($imageType) {
        case 'image/jpeg':
            $sourceImage = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = @imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            // Don't process GIFs - they may be animated
            // Just copy the original file
            copy($sourcePath, $destPath);
            return ['success' => true, 'resized' => false, 'preserved' => 'GIF (may be animated)'];
        default:
            return ['error' => 'Unsupported image type: ' . $imageType];
    }

    if (!$sourceImage) {
        return ['error' => 'Failed to load image'];
    }

    $width = imagesx($sourceImage);
    $height = imagesy($sourceImage);

    // Calculate new dimensions if resizing needed
    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = (int)(($height / $width) * $newWidth);

        // Create new image with calculated dimensions
        $destImage = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG
        if ($imageType === 'image/png') {
            imagealphablending($destImage, false);
            imagesavealpha($destImage, true);
            $transparent = imagecolorallocatealpha($destImage, 0, 0, 0, 127);
            imagefill($destImage, 0, 0, $transparent);
        }

        // Resample image
        imagecopyresampled($destImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Save in original format
        $saved = false;
        if ($imageType === 'image/jpeg') {
            $saved = imagejpeg($destImage, $destPath, $quality);
        } else if ($imageType === 'image/png') {
            // PNG compression level 0-9 (9 = maximum compression)
            $pngCompression = 6;
            $saved = imagepng($destImage, $destPath, $pngCompression);
        }

        imagedestroy($destImage);
        imagedestroy($sourceImage);

        if ($saved) {
            return ['success' => true, 'resized' => true, 'originalSize' => [$width, $height], 'newSize' => [$newWidth, $newHeight]];
        } else {
            return ['error' => 'Failed to save optimized image'];
        }
    } else {
        // Image is already small enough, just optimize compression
        $saved = false;
        if ($imageType === 'image/jpeg') {
            // Re-save JPEG with specified quality
            $saved = imagejpeg($sourceImage, $destPath, $quality);
        } else if ($imageType === 'image/png') {
            // Re-save PNG with compression
            $pngCompression = 6;
            $saved = imagepng($sourceImage, $destPath, $pngCompression);
        }

        imagedestroy($sourceImage);

        if ($saved) {
            return ['success' => true, 'resized' => false];
        } else {
            return ['error' => 'Failed to save optimized image'];
        }
    }
}

/**
 * Generate thumbnail for an image
 * - Creates a 350x250 thumbnail (matching client-side canvas dimensions)
 * - Saves as PNG to preserve transparency
 *
 * @param string $sourcePath Path to source image
 * @param string $thumbPath Path to save thumbnail
 * @return array Success/error response
 */
function generateThumbnail($sourcePath, $thumbPath) {
    global $conf;

    // Check if GD library is available
    if (!function_exists('imagecreatefromjpeg')) {
        error_log('FrameTrail: GD library not available for thumbnail generation');
        return ['error' => 'GD library not available'];
    }

    // Get image info
    $imageInfo = @getimagesize($sourcePath);
    if (!$imageInfo) {
        return ['error' => 'Invalid image file'];
    }

    $sourceImage = null;
    $imageType = $imageInfo['mime'];

    // Load source image based on type
    switch ($imageType) {
        case 'image/jpeg':
            $sourceImage = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = @imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            $sourceImage = @imagecreatefromgif($sourcePath);
            break;
        default:
            return ['error' => 'Unsupported image type: ' . $imageType];
    }

    if (!$sourceImage) {
        return ['error' => 'Failed to load image'];
    }

    $sourceWidth = imagesx($sourceImage);
    $sourceHeight = imagesy($sourceImage);

    // Target thumbnail dimensions (350x250 max, matching client-side canvas)
    // Client-side uses: <canvas width="350px" height="250px">
    $thumbWidth = 350;
    $thumbHeight = 250;

    // Calculate dimensions while maintaining aspect ratio
    $aspectRatio = $sourceWidth / $sourceHeight;
    if ($aspectRatio > ($thumbWidth / $thumbHeight)) {
        // Width is limiting factor
        $newWidth = $thumbWidth;
        $newHeight = (int)($thumbWidth / $aspectRatio);
    } else {
        // Height is limiting factor
        $newHeight = $thumbHeight;
        $newWidth = (int)($thumbHeight * $aspectRatio);
    }

    // Create thumbnail canvas
    $thumbImage = imagecreatetruecolor($newWidth, $newHeight);

    // Preserve transparency
    imagealphablending($thumbImage, false);
    imagesavealpha($thumbImage, true);
    $transparent = imagecolorallocatealpha($thumbImage, 0, 0, 0, 127);
    imagefill($thumbImage, 0, 0, $transparent);

    // Resample image to thumbnail size
    imagecopyresampled($thumbImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $sourceWidth, $sourceHeight);

    // Save as PNG (preserves transparency)
    $saved = imagepng($thumbImage, $thumbPath, 6);

    imagedestroy($thumbImage);
    imagedestroy($sourceImage);

    if ($saved) {
        return ['success' => true, 'thumbSize' => [$newWidth, $newHeight]];
    } else {
        return ['error' => 'Failed to save thumbnail'];
    }
}

/**
 * Generate video thumbnail using FFmpeg
 * Extracts a frame at 50% of video duration (like client-side generation)
 *
 * @param string $videoPath Path to video file
 * @param string $thumbPath Path for output thumbnail
 * @return array Success/error response
 */
function generateVideoThumbnail($videoPath, $thumbPath) {
    $ffmpegPath = detectFFmpegPath();

    if (!$ffmpegPath) {
        return ['error' => 'FFmpeg not available for thumbnail generation'];
    }

    // First, get video duration using ffprobe or ffmpeg
    $durationCommand = sprintf(
        '%s -i %s 2>&1 | grep "Duration"',
        escapeshellcmd($ffmpegPath),
        escapeshellarg($videoPath)
    );

    exec($durationCommand, $durationOutput, $returnCode);

    // Parse duration from output like: "Duration: 00:01:30.45"
    $timeOffset = 2.0; // Default fallback
    if (!empty($durationOutput) && preg_match('/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/', $durationOutput[0], $matches)) {
        $hours = (int)$matches[1];
        $minutes = (int)$matches[2];
        $seconds = (float)$matches[3];
        $totalSeconds = ($hours * 3600) + ($minutes * 60) + $seconds;

        // Extract frame at 50% of video duration
        $timeOffset = $totalSeconds / 2.0;
        error_log('FrameTrail: Video duration: ' . $totalSeconds . 's, extracting thumbnail at ' . $timeOffset . 's (50%)');
    }

    // Extract a single frame from the video at 50% duration
    // -ss: seek to time position
    // -i: input file
    // -vframes 1: extract only 1 frame
    // -vf scale: scale to max 400px width, height auto (maintains aspect ratio)
    // Client-side draws video on canvas maintaining aspect ratio, no black bars
    $command = sprintf(
        '%s -ss %f -i %s -vframes 1 -vf "scale=\'min(400,iw)\':-2" %s 2>&1',
        escapeshellcmd($ffmpegPath),
        $timeOffset,
        escapeshellarg($videoPath),
        escapeshellarg($thumbPath)
    );

    error_log('FrameTrail: Generating video thumbnail: ' . $command);

    exec($command, $output, $returnCode);

    if ($returnCode === 0 && file_exists($thumbPath)) {
        error_log('FrameTrail: Video thumbnail generated successfully');
        return ['success' => true, 'path' => $thumbPath];
    } else {
        $errorMsg = 'Thumbnail generation failed: ' . implode("\n", $output);
        error_log('FrameTrail: ' . $errorMsg);
        return ['error' => $errorMsg];
    }
}

/**
 * Validate file size against upload limits
 *
 * @param int $fileSize File size in bytes
 * @return array Valid/error response
 */
function validateFileSize($fileSize) {
    $maxUploadSize = fileGetMaxUploadSize();

    if ($fileSize > $maxUploadSize['maxuploadbytes']) {
        return [
            'valid' => false,
            'error' => 'File size (' . formatBytes($fileSize) . ') exceeds maximum upload size (' . formatBytes($maxUploadSize['maxuploadbytes']) . ')'
        ];
    }

    return ['valid' => true];
}

/**
 * Format bytes to human-readable format
 *
 * @param int $bytes
 * @param int $precision
 * @return string
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1024, $pow);

    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Detect FFmpeg installation on server
 *
 * @return string|null FFmpeg path if found, null otherwise
 */
function detectFFmpegPath() {
    // Try common paths where FFmpeg might be installed
    $paths = [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg', // macOS Homebrew
        'ffmpeg' // System PATH
    ];

    foreach ($paths as $path) {
        // Try to execute FFmpeg version check
        @exec(escapeshellcmd($path) . ' -version 2>&1', $output, $returnCode);
        if ($returnCode === 0 && !empty($output)) {
            // Verify it's actually FFmpeg by checking output
            if (stripos(implode(' ', $output), 'ffmpeg') !== false) {
                error_log('FrameTrail: FFmpeg found at: ' . $path);
                return $path;
            }
        }
        // Clear output for next iteration
        $output = [];
    }

    error_log('FrameTrail: FFmpeg not found in common locations');
    return null;
}

/**
 * Transcode video to MP4 format with H.264/AAC codecs
 *
 * @param string $sourcePath Path to source video file
 * @param string $destPath Path for output MP4 file
 * @param int $maxWidth Maximum width (default 1920)
 * @return array Success/error response with details
 */
function transcodeVideoToMP4($sourcePath, $destPath, $maxWidth = 1920) {
    $ffmpegPath = detectFFmpegPath();

    if (!$ffmpegPath) {
        return ['error' => 'FFmpeg not available on this server'];
    }

    // Good defaults for web video
    $crf = 23; // Quality (0-51, 23 = default, lower = better quality but larger file)

    // Build FFmpeg command
    // -i: input file
    // -c:v libx264: H.264 video codec
    // -crf 23: Constant Rate Factor quality
    // -vf "scale=...": Scale video maintaining aspect ratio
    // -c:a aac: AAC audio codec
    // -b:a 192k: Audio bitrate 192 kbps
    // -movflags +faststart: Enable streaming before complete download
    // -y: Overwrite output file if exists
    $command = sprintf(
        '%s -i %s -c:v libx264 -crf %d -vf "scale=\'min(%d,iw)\':-2" -c:a aac -b:a 192k -movflags +faststart -y %s 2>&1',
        escapeshellcmd($ffmpegPath),
        escapeshellarg($sourcePath),
        $crf,
        $maxWidth,
        escapeshellarg($destPath)
    );

    error_log('FrameTrail: Running FFmpeg command: ' . $command);

    exec($command, $output, $returnCode);

    if ($returnCode === 0 && file_exists($destPath)) {
        $outputSize = filesize($destPath);
        $inputSize = filesize($sourcePath);
        error_log('FrameTrail: Video transcoding successful. Input: ' . formatBytes($inputSize) . ', Output: ' . formatBytes($outputSize));
        return [
            'success' => true,
            'path' => $destPath,
            'inputSize' => $inputSize,
            'outputSize' => $outputSize
        ];
    } else {
        $errorMsg = 'Transcoding failed: ' . implode("\n", $output);
        error_log('FrameTrail: ' . $errorMsg);
        return ['error' => $errorMsg];
    }
}

/**
 * Transcode audio to MP3 format
 *
 * @param string $sourcePath Path to source audio file
 * @param string $destPath Path for output MP3 file
 * @param int $bitrate Audio bitrate in kbps (default 192)
 * @return array Success/error response with details
 */
function transcodeAudioToMP3($sourcePath, $destPath, $bitrate = 192) {
    $ffmpegPath = detectFFmpegPath();

    if (!$ffmpegPath) {
        return ['error' => 'FFmpeg not available on this server'];
    }

    // Build FFmpeg command
    // -i: input file
    // -c:a libmp3lame: MP3 audio codec
    // -b:a: Audio bitrate
    // -y: Overwrite output file if exists
    $command = sprintf(
        '%s -i %s -c:a libmp3lame -b:a %dk -y %s 2>&1',
        escapeshellcmd($ffmpegPath),
        escapeshellarg($sourcePath),
        $bitrate,
        escapeshellarg($destPath)
    );

    error_log('FrameTrail: Running FFmpeg command: ' . $command);

    exec($command, $output, $returnCode);

    if ($returnCode === 0 && file_exists($destPath)) {
        $outputSize = filesize($destPath);
        $inputSize = filesize($sourcePath);
        error_log('FrameTrail: Audio transcoding successful. Input: ' . formatBytes($inputSize) . ', Output: ' . formatBytes($outputSize));
        return [
            'success' => true,
            'path' => $destPath,
            'inputSize' => $inputSize,
            'outputSize' => $outputSize
        ];
    } else {
        $errorMsg = 'Transcoding failed: ' . implode("\n", $output);
        error_log('FrameTrail: ' . $errorMsg);
        return ['error' => $errorMsg];
    }
}


?>