<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Support\Notifier;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /**
     * POST /api/complaints
     * A signed-in student/teacher sends a complaint or feedback.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'open',
        ]);

        Notifier::notifyAdmins(
            'New complaint / feedback',
            $request->user()->name . ': ' . $complaint->subject,
            'complaint_submitted',
            null,
            $complaint
        );

        return response()->json([
            'message' => 'Feedback submitted successfully.',
            'data' => $complaint,
        ], 201);
    }

    /**
     * GET /api/admin/complaints   (admin only - route middleware)
     */
    public function index()
    {
        return response()->json([
            'data' => Complaint::with('user:id,name,email,contact_number')
                ->latest()
                ->get(),
        ]);
    }

    /**
     * PATCH /api/admin/complaints/{complaint}/reply   (admin only)
     *
     * Saves the admin's answer and drops a notification in the
     * complainant's bell so they can read it in the app.
     */
    public function reply(Request $request, Complaint $complaint)
    {
        $validated = $request->validate([
            'reply' => ['required', 'string', 'max:5000'],
        ]);

        $complaint->update([
            'admin_reply' => trim($validated['reply']),
            'replied_at' => now(),
            'status' => 'replied',
        ]);

        if ($complaint->user) {
            Notifier::notify(
                $complaint->user,
                'Admin replied to your feedback',
                'Re: "' . $complaint->subject . '" - ' . $complaint->admin_reply,
                'complaint_reply',
                null,
                $complaint
            );
        }

        return response()->json([
            'message' => 'Reply sent.',
            'data' => $complaint->fresh()->load('user:id,name,email,contact_number'),
        ]);
    }
}
