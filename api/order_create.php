<?php
require __DIR__ . '/db_order.php';

$body = json_decode(file_get_contents('php://input'), true);
$user = trim($body['user'] ?? '');
$currency = strtoupper(trim($body['currency'] ?? 'USD'));
$items = $body['items'] ?? [];

if ($user === '' || !is_array($items) || !count($items)) {
  bad('Missing user or items');
}

$clean = [];
$total = 0.0;

foreach ($items as $i) {
  $pid = trim($i['id'] ?? '');
  $name = trim($i['name'] ?? '');
  $qty  = (int)($i['qty'] ?? 0);
  $price= (float)($i['price'] ?? 0);
  $img  = trim($i['img'] ?? '');
  if ($pid === '' || $name === '' || $qty <= 0 || $price < 0) continue;

  $line = round($price, 2) * $qty;
  $total += $line;
  $clean[] = [
    'id' => $pid,
    'name' => $name,
    'qty' => $qty,
    'price' => round($price, 2),
    'img' => $img
  ];
}

if (!$clean) bad('No valid items');

try {
  $pdo = pdo();
  $pdo->beginTransaction();

  $stmt = $pdo->prepare("INSERT INTO orders (user, total, currency) VALUES (?, ?, ?)");
  $stmt->execute([$user, round($total,2), $currency]);
  $orderId = (int)$pdo->lastInsertId();

  $ins = $pdo->prepare("INSERT INTO order_items (order_id, product_id, name, qty, unit_price, img)
                        VALUES (?, ?, ?, ?, ?, ?)");
  foreach ($clean as $c) {
    $ins->execute([$orderId, $c['id'], $c['name'], $c['qty'], $c['price'], $c['img']]);
  }

  $pdo->commit();
  ok(['order_id'=>$orderId, 'total'=>round($total,2), 'currency'=>$currency]);
} catch (Throwable $e) {
  if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
  bad('DB error: '.$e->getMessage(), 500);
}
