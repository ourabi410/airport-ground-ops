<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $task;
    public ?array $user;
    public ?array $flight;
    public ?array $company;

    /**
     * Create a new message instance.
     */
    public function __construct(array $task, ?array $user = null, ?array $flight = null, ?array $company = null)
    {
        $this->task = $task;
        $this->user = $user;
        $this->flight = $flight;
        $this->company = $company;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $flightNbr = $this->task['flightNbr'] ?? ($this->flight['flightNbr'] ?? 'N/A');
        $targetTime = $this->task['targetTime'] ?? 'N/A';
        $title = $this->task['taskTitle'] ?? 'Ground Handling Task';

        return new Envelope(
            subject: "⏰ [AeroTurn Alert] Task Reminder: {$title} (Due: {$targetTime}) - Flight {$flightNbr}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.task_reminder',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
