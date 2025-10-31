<?php
require __DIR__ . '/db_order.php';

$user = isset($_GET['user']) ? trim($_GET['user']) : '';
if ($user === '') bad('Missing user');

try {
  $pdo = pdo();
  $h = $pdo->prepare("SELECT id, total, currency, created_at FROM orders
                      WHERE user = ? ORDER BY created_at DESC");
  $h->execute([$user]);
  $orders = $h->fetchAll();
  if (!$orders) ok([]);

  $ids = array_column($orders, 'id');
  $in = implode(',', array_fill(0, count($ids), '?'));
  $li = $pdo->prepare("SELECT order_id, product_id, name, qty, unit_price, img
                       FROM order_items WHERE order_id IN ($in)");
  $li->execute($ids);
  $by = [];
  while ($r = $li->fetch()) { $by[$r['order_id']][] = $r; }

  foreach ($orders as &$o) {
    $o['items'] = $by[$o['id']] ?? [];
  }
  ok($orders);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
