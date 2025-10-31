<?php
// api/accessories_list.php
declare(strict_types=1);
require __DIR__ . '/db_accessories.php';

header('Content-Type: application/json');

$sql = "SELECT id, sku, name, price, image_url, description, stock
        FROM accessories
        WHERE is_active = 1
        ORDER BY id DESC";

$res = $mysqli->query($sql);
if (!$res) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'QUERY_FAILED']);
  exit;
}

$data = [];
while ($row = $res->fetch_assoc()) {
  // Cast numeric fields
  $row['id'] = (int)$row['id'];
  $row['price'] = (float)$row['price'];
  $row['stock'] = (int)$row['stock'];
  $data[] = $row;
}

echo json_encode(['ok' => true, 'items' => $data]);
