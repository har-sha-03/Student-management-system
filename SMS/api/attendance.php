<?php
header("Content-Type: application/json");
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $student_id = intval($data['student_id']);
    $status = $conn->real_escape_string($data['status']);
    $date = date('Y-m-d'); // Today's date

    // Upsert attendance
    $query = "INSERT INTO attendance (student_id, date, status) VALUES ($student_id, '$date', '$status') 
              ON DUPLICATE KEY UPDATE status='$status'";
              
    if ($conn->query($query) === TRUE) {
        echo json_encode(["message" => "Attendance marked successfully"]);
    } else {
        echo json_encode(["error" => "Error: " . $conn->error]);
    }
} else if ($method == 'GET') {
    $date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : date('Y-m-d');
    $query = "SELECT s.id, s.name, s.roll_no, a.status FROM students s LEFT JOIN attendance a ON s.id = a.student_id AND a.date = '$date' ORDER BY s.name ASC";
    $result = $conn->query($query);
    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $attendance[] = $row;
    }
    echo json_encode($attendance);
}

$conn->close();
?>
