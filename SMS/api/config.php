<?php
error_reporting(0);
ini_set('display_errors', 0);
$host = "sql306.infinityfree.com";
$username = "if0_41966911"; // Update this with your database username
$password = "8tYwa5NyOw4";     // Update this with your database password
$database = "if0_41966911_sms_db";

try {
    $conn = new mysqli($host, $username, $password, $database);
    if ($conn->connect_error) {
        die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
    }
} catch (Exception $e) {
    die(json_encode(["error" => "DB Exception: " . $e->getMessage()]));
}
?>
