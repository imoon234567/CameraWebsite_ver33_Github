<?php
require __DIR__ . '/db_addr.php';

$body = json_decode(file_get_contents('php://input'), true);
$user       = trim($body['user']       ?? '');
$first_name = trim($body['first_name'] ?? '');
$last_name  = trim($body['last_name']  ?? '');
$addr_line  = trim($body['addr_line']  ?? '');
$city       = trim($body['city']       ?? '');
$country    = trim($body['country']    ?? '');
$postal     = trim($body['postal_code']?? '');

if ($user==='' || $first_name==='' || $last_name==='' || $addr_line==='' || $city==='' || $country==='' || $postal==='') {
  bad('All fields are required');
}

try{
  $sql = "INSERT INTO `addresses` (`user`, first_name, last_name, addr_line, city, country, postal_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            first_name=VALUES(first_name),
            last_name=VALUES(last_name),
            addr_line=VALUES(addr_line),
            city=VALUES(city),
            country=VALUES(country),
            postal_code=VALUES(postal_code)";
  $stmt = pdo()->prepare($sql);
  $stmt->execute([$user, $first_name, $last_name, $addr_line, $city, $country, $postal]);
  ok(['saved'=>true]);
}catch(Throwable $e){
  bad('DB error: '.$e->getMessage(), 500);
}
