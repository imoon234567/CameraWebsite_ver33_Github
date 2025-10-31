<?php
require __DIR__ . '/db.php';

try {
  $stmt = pdo()->query("SELECT id, name, price, currency, img, blurb FROM products ORDER BY name");
  $rows = $stmt->fetchAll();
  ok($rows);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
