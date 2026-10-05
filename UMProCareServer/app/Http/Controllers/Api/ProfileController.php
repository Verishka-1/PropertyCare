<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * GET /api/user/profile
     *
     * Return the currently authenticated user's profile.
     *
     * The user's ID and role are returned for display/reference,
     * but they cannot be changed through the update endpoint.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    /**
     * PATCH /api/user/profile
     *
     * Users can update their own:
     * - first name
     * - last name
     * - username
     * - email
     *
     * Users cannot update:
     * - ID
     * - role
     * - password
     * - banned status
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => [
                'required',
                'string',
                'max:100',
            ],

            'last_name' => [
                'required',
                'string',
                'max:100',
            ],

            'username' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('users', 'username')
                    ->ignore($user->id),
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user->id),
            ],
        ]);

        $user->update([
            'first_name' => trim($validated['first_name']),
            'last_name' => trim($validated['last_name']),

            // Keep the name column synchronized.
            'name' => trim(
                $validated['first_name'] .
                ' ' .
                $validated['last_name']
            ),

            'username' => trim($validated['username']),
            'email' => strtolower(trim($validated['email'])),
        ]);

        $user = $user->fresh();

        return response()->json([
            'message' => 'Profile updated successfully.',

            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * POST /api/user/push-token
     *
     * Save the user's Expo push notification token.
     */
    public function updatePushToken(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => [
                'required',
                'string',
            ],
        ]);

        $request->user()->update([
            'expo_push_token' => $validated['expo_push_token'],
        ]);

        return response()->json([
            'message' => 'Push token saved.',
        ]);
    }
}