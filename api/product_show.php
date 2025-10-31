<?php
require __DIR__ . '/db.php';

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
if ($id === '') bad('Missing id');

try {
  $stmt = pdo()->prepare("SELECT id, name, price, currency, img, blurb, description FROM products WHERE id = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) bad('Not found', 404);
  ok($row);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
