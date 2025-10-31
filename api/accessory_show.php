<?php
// api/accessory_show.php
declare(strict_types=1);
require __DIR__ . '/db_accessories.php';

header('Content-Type: application/json');

$sku = isset($_GET['sku']) ? trim($_GET['sku']) : '';
$id  = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$sku && !$id) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'MISSING_PARAM']);
  exit;
}

if ($sku) {
  $stmt = $mysqli->prepare("SELECT id, sku, name, price, image_url, description, stock
                             FROM accessories WHERE sku=? AND is_active=1 LIMIT 1");
  $stmt->bind_param('s', $sku);
} else {
  $stmt = $mysqli->prepare("SELECT id, sku, name, price, image_url, description, stock
                             FROM accessories WHERE id=? AND is_active=1 LIMIT 1");
  $stmt->bind_param('i', $id);
}

if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'QUERY_FAILED']);
  exit;
}

$res = $stmt->get_result();
$item = $res->fetch_assoc();
if (!$item) {
  http_response_code(404);
  echo json_encode(['ok' => false, 'error' => 'NOT_FOUND']);
  exit;
}

$item['id']    = (int)$item['id'];
$item['price'] = (float)$item['price'];
$item['stock'] = (int)$item['stock'];

echo json_encode(['ok' => true, 'item' => $item]);
