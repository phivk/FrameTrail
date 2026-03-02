<?php
error_reporting(E_ALL ^ E_NOTICE ^ E_WARNING);

$_isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
         || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => $_isHttps,
]);
session_start();

// Directories
$conf["dir"]["data"] = "../_data";
$conf["dir"]["projects"] = $conf["dir"]["data"]."/projects";

// JSON response flags
$conf["settings"]["json_flags"] = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;

// Server config
$conf["server"]["session_lifetime"] = ini_get('session.gc_maxlifetime');
//$conf["server"]["session_lifetime"] = 40;

require_once("functions.incl.php");

?>