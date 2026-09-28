<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * PATCH /api/user/profile
     *
     * Users can update their own name/username/email but never their
     * ID or role from this endpoint.
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
        ]);

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
            'username' => $validated['username'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * POST /api/user/push-token
     *
     * Called by the app whenever Expo hands it a push token
     * (on login, and again if the token ever rotates).
     */
    public function updatePushToken(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string'],
        ]);

        $request->user()->update([
            'expo_push_token' => $validated['expo_push_token'],
        ]);

        return response()->json(['message' => 'Push token saved.']);
    }
}
