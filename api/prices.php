<?php
require __DIR__ . '/db.php';

try {
  $stmt = pdo()->query("SELECT id, price, currency FROM products");
  $map = [];
  while ($r = $stmt->fetch()) {
    $map[$r['id']] = [
      'price'    => (float)$r['price'],
      'currency' => $r['currency']
    ];
  }
  ok($map);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
