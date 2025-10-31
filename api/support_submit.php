<?php
require __DIR__ . '/db_support.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  bad('Use POST');
}

$body = json_decode(file_get_contents('php://input'), true);

$name = trim($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$message = trim($body['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
  bad('All fields are required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  bad('Invalid email format');
}

// Optional: basic length limits (keeps DB happy)
if (mb_strlen($name) > 120)   $name = mb_substr($name, 0, 120);
if (mb_strlen($email) > 254)  $email = mb_substr($email, 0, 254);

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

try {
  $stmt = pdo()->prepare("
    INSERT INTO support_messages (name, email, message, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  ");
  $stmt->execute([$name, $email, $message, $ip, $ua]);

  ok([
    'saved' => true,
    'id' => (int)pdo()->lastInsertId()
  ]);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
