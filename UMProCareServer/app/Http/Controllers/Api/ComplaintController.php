<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    // Signed-in campus user submits a complaint or feedback.
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

    return response()->json([
        'message' => 'Feedback submitted successfully.',
        'data' => $complaint,
    ], 201);
}

    // Admin gets the complaint list.
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        return response()->json([
            'data' => Complaint::with('user:id,name,email')
                ->latest()
                ->get(),
        ]);
    }
    
}