<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json'); // always respond in JSON

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$messageContent = trim($_POST['message'] ?? '');

if (empty($name) || empty($email) || empty($subject) || empty($messageContent)) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email address.']);
    exit;
}

$mail = new PHPMailer(true);
try {
    // SMTP setup
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'youraddress@gmail.com'; // your Gmail
    $mail->Password = 'your_app_specific_password'; // app password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // Recipients
    $mail->setFrom('youraddress@gmail.com', 'Portfolio Contact');
    $mail->addReplyTo($email, $name);
    $mail->addAddress('youraddress@gmail.com'); // destination inbox

    // Message
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = "New message from your portfolio site:\n\n"
                . "Name: $name\n"
                . "Email: $email\n\n"
                . "Message:\n$messageContent";

    $mail->send();

    // Optional auto-reply to sender
    $autoReply = new PHPMailer(true);
    $autoReply->isSMTP();
    $autoReply->Host = 'smtp.gmail.com';
    $autoReply->SMTPAuth = true;
    $autoReply->Username = 'youraddress@gmail.com';
    $autoReply->Password = 'your_app_specific_password';
    $autoReply->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $autoReply->Port = 587;
    $autoReply->setFrom('youraddress@gmail.com', 'Francis Kamau');
    $autoReply->addAddress($email, $name);
    $autoReply->Subject = 'Thanks for reaching out!';
    $autoReply->Body = "Hi $name,\n\nThanks for reaching out through my portfolio site! I’ve received your message and will get back to you soon.\n\nBest,\nFrancis Kamau";
    $autoReply->send();

    echo json_encode(['status' => 'success', 'message' => 'Your message has been sent successfully!']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
