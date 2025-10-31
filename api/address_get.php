<?php
require __DIR__ . '/db_addr.php';

$user = isset($_GET['user']) ? trim($_GET['user']) : '';
if ($user === '') bad('Missing user');

try {
  $stmt = pdo()->prepare(
    "SELECT `user`, first_name, last_name, addr_line, city, country, postal_code, updated_at
     FROM `addresses` WHERE `user` = ?"
  );
  $stmt->execute([$user]);
  $row = $stmt->fetch();
  if (!$row) ok(null);  // no address yet
  else ok($row);
} catch (Throwable $e) {
  bad('DB error: '.$e->getMessage(), 500);
}
