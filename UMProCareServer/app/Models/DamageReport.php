<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DamageReport extends Model
{
    /**
     * Report life-cycle (admin side):
     *
     *   pending -> verified (ACCEPTED) -> in_progress (REPAIR) -> completed
     *   pending -> rejected
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'verified';
    public const STATUS_REPAIR = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_REJECTED = 'rejected';

    /** Statuses that still count on the admin maps (not finished yet). */
    public const ACTIVE_STATUSES = ['pending', 'verified', 'assigned', 'in_progress'];

    protected $fillable = [
        'report_number',
        'user_id',
        'building_id',
        'room_id',
        'property_name',
        'description',
        'priority',
        'status',
        'reported_at',
    ];

    protected function casts(): array
    {
        return ['reported_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'building_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(DamageReportPhoto::class);
    }

    public function repairUpdates(): HasMany
    {
        return $this->hasMany(RepairUpdate::class)->latest();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ReportAssignment::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Flat shape used by every list/detail screen in the app.
     */
    public function toApiArray(bool $withPhotos = false): array
    {
        $this->loadMissing(['building:id,name', 'room:id,name', 'user:id,name,email,contact_number']);

        $data = [
            'id' => $this->id,
            'report_number' => $this->report_number,
            'title' => $this->property_name ?: 'Damage report',
            'property_name' => $this->property_name,
            'description' => $this->description,
            'building_id' => $this->building_id,
            'room_id' => $this->room_id,
            'building_name' => $this->building?->name ?? 'Unknown building',
            'room_name' => $this->room?->name ?? 'Unknown room',
            'status' => $this->status,
            'priority' => $this->priority,
            'reported_at' => $this->reported_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'contact_number' => $this->user->contact_number,
            ] : null,
        ];

        if ($withPhotos) {
            $data['photos'] = $this->photos;
            $data['repairUpdates'] = $this->repairUpdates;
        }

        return $data;
    }
}
