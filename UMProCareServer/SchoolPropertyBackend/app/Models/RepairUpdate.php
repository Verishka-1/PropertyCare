<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairUpdate extends Model
{
    protected $fillable = [
        'damage_report_id',
        'maintenance_user_id',
        'status',
        'notes',
    ];

    public function damageReport(): BelongsTo
    {
        return $this->belongsTo(DamageReport::class);
    }

    public function maintenanceUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'maintenance_user_id');
    }
}
