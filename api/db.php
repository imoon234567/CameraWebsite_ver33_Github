<?php
// api/db.php
header('Content-Type: application/json; charset=utf-8');

// CORS for development (so Live Server -> Apache works)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // <-- add POST here
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$DB_HOST = '127.0.0.1';
$DB_NAME = 'camera_product_database'; // <— your DB name
$DB_USER = 'root';
$DB_PASS = ''; // XAMPP default (empty). Change if you set a password.

function pdo() {
  static $pdo = null;
  if ($pdo) return $pdo;

  global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
  $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
  $opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ];
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $opt);
  return $pdo;
}

function ok($data){
  echo json_encode(['ok'=>true,'data'=>$data], JSON_UNESCAPED_UNICODE);
  exit;
}

function bad($msg, $code=400){
  http_response_code($code);
  echo json_encode(['ok'=>false,'error'=>$msg]);
  exit;
}
