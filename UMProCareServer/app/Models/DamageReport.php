<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DamageReport extends Model
{
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
public function building()
{
    return $this->belongsTo(
        \App\Models\Building::class,
        'building_id'
    );
}

public function room()
{
    return $this->belongsTo(
        \App\Models\Room::class,
        'room_id'
    );
}
}
