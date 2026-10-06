<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamageReportPhoto extends Model
{
    protected $fillable = [
        'damage_report_id',
        'photo_path',
    ];

    // `url` is added to every JSON response so the app never has to
    // build storage paths itself.
    protected $appends = ['url'];

    public function damageReport(): BelongsTo
    {
        return $this->belongsTo(DamageReport::class);
    }

    /**
     * Photos are served by the /media route (routes/web.php), and the URL is
     * built from the CURRENT request host. That means the link always matches
     * the address the phone used to reach the API - it no longer depends on
     * APP_URL or on `php artisan storage:link`.
     */
    public function getUrlAttribute(): string
    {
        return url('/media/' . ltrim($this->photo_path, '/'));
    }
}
