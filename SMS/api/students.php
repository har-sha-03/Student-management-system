<?php
header("Content-Type: application/json");
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Search & Filter
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $query = "SELECT * FROM students";
        if ($search) {
            $query .= " WHERE name LIKE '%$search%' OR roll_no LIKE '%$search%'";
        }
        $query .= " ORDER BY created_at DESC";
        $result = $conn->query($query);
        $students = [];
        while ($row = $result->fetch_assoc()) {
            $students[] = $row;
        }
        echo json_encode($students);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = isset($data['action']) ? $data['action'] : 'create';
        
        if ($action == 'delete') {
            $id = isset($data['id']) ? intval($data['id']) : 0;
            if ($id > 0) {
                $query = "DELETE FROM students WHERE id=$id";
                if ($conn->query($query) === TRUE) {
                    echo json_encode(["message" => "Student deleted successfully"]);
                } else {
                    echo json_encode(["error" => "Error: " . $conn->error]);
                }
            } else {
                echo json_encode(["error" => "Invalid ID"]);
            }
        } else if ($action == 'update') {
            $id = $conn->real_escape_string($data['id']);
            $name = $conn->real_escape_string($data['name']);
            $roll_no = $conn->real_escape_string($data['roll_no']);
            $email = $conn->real_escape_string($data['email']);
            $course = $conn->real_escape_string($data['course']);
            $status = $conn->real_escape_string($data['status']);

            $query = "UPDATE students SET name='$name', roll_no='$roll_no', email='$email', course='$course', status='$status' WHERE id=$id";
            if ($conn->query($query) === TRUE) {
                echo json_encode(["message" => "Student updated successfully"]);
            } else {
                echo json_encode(["error" => "Error: " . $conn->error]);
            }
        } else {
            // Create
            $name = $conn->real_escape_string($data['name']);
            $roll_no = $conn->real_escape_string($data['roll_no']);
            $email = $conn->real_escape_string($data['email']);
            $course = $conn->real_escape_string($data['course']);
            $status = isset($data['status']) ? $conn->real_escape_string($data['status']) : 'Active';

            $query = "INSERT INTO students (name, roll_no, email, course, status) VALUES ('$name', '$roll_no', '$email', '$course', '$status')";
            if ($conn->query($query) === TRUE) {
                echo json_encode(["message" => "Student created successfully"]);
            } else {
                echo json_encode(["error" => "Error: " . $conn->error]);
            }
        }
        break;
}

$conn->close();
?>
