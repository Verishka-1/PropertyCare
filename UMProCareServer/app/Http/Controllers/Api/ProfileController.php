<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'contact_number' => $user->contact_number,
            'role' => $user->role,
        ];
    }

    /**
     * GET /api/user/profile
     */
    public function show(Request $request)
    {
        return response()->json($this->present($request->user()));
    }

    /**
     * PATCH /api/user/profile
     *
     * Users can update their name, username, email and contact number.
     * They can NOT change their ID, role, password or banned status.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'username' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'contact_number' => ['nullable', 'string', 'regex:/^[0-9+()\-\s]{7,20}$/'],
        ], [
            'contact_number.regex' => 'Please enter a valid contact number (7-20 digits).',
        ]);

        $user->update([
            'first_name' => trim($validated['first_name']),
            'last_name' => trim($validated['last_name']),
            'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
            'username' => trim($validated['username']),
            'email' => strtolower(trim($validated['email'])),
            // only touch the number when the app actually sent it
            'contact_number' => array_key_exists('contact_number', $validated)
                ? $validated['contact_number']
                : $user->contact_number,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $this->present($user->fresh()),
        ]);
    }
}
