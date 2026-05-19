<?php
header("Content-Type: application/json");
require 'config.php';

$stats = [
    "total_students" => 0,
    "total_courses" => 0,
    "attendance_percentage" => 0
];

// Total students
$res = $conn->query("SELECT COUNT(*) as count FROM students");
if ($res) {
    $row = $res->fetch_assoc();
    $stats["total_students"] = $row["count"];
}

// Total distinct courses
$res = $conn->query("SELECT COUNT(DISTINCT course) as count FROM students");
if ($res) {
    $row = $res->fetch_assoc();
    $stats["total_courses"] = $row["count"];
}

// Attendance percentage (Present / Total records * 100)
$res = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present FROM attendance");
if ($res) {
    $row = $res->fetch_assoc();
    if ($row["total"] > 0) {
        $stats["attendance_percentage"] = round(($row["present"] / $row["total"]) * 100, 2);
    }
}

echo json_encode($stats);
$conn->close();
?>
