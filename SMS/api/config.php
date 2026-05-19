<?php
$host = "127.0.0.1";
$port = 3306;
$username = "root"; // Update this with your database username
$password = "";     // Update this with your database password
$database = "antigravity_sms";

$conn = new mysqli($host, $username, $password, $database, $port);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
?>
