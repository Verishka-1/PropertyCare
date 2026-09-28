<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'username',
        'email',
        'password',
        'role',
        'is_banned',
        'expo_push_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_banned' => 'boolean',
        ];
    }

    public function damageReports(): HasMany
    {
        return $this->hasMany(DamageReport::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    /**
     * This app's own in-app notification records (App\Models\Notification).
     *
     * Note: this intentionally overrides the notifications() relation that
     * the Notifiable trait would otherwise provide for Laravel's built-in
     * notification system, which this app does not use.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->latest();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
