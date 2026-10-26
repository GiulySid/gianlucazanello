<?php
/**
 * Contact form handler for Aruba hosting.
 * Sends messages to info@gianlucazanello.it via PHP mail().
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

function field(string $key): string
{
    $v = isset($_POST[$key]) ? $_POST[$key] : '';
    $v = is_string($v) ? $v : '';
    return trim(str_replace(["\r", "\n"], ' ', $v));
}

$name = field('name');
$surname = field('surname');
$email = field('email');
$message = isset($_POST['message']) ? trim((string) $_POST['message']) : '';
$hp = field('company'); // honeypot

if ($hp !== '') {
    // Bot trap: pretend success
    echo json_encode(['ok' => true]);
    exit;
}

if ($name === '' || $surname === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'email']);
    exit;
}

if (mb_strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'length']);
    exit;
}

$to = 'info@gianlucazanello.it';
$subject = 'Contatto da sito — ' . $name . ' ' . $surname;
$body = "Nome: {$name}\nCognome: {$surname}\nEmail: {$email}\n\n{$message}\n";
$body = str_replace(["\r\n", "\r"], "\n", $body);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: Gianluca Zanello Site <noreply@gianlucazanello.it>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'send']);
    exit;
}

echo json_encode(['ok' => true]);
