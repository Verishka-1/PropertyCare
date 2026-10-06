# UMProCare - removes backend files that no longer exist in the new version.
# Run this from the UMProCareServer folder:
#     powershell -ExecutionPolicy Bypass -File .\RUN_ME_delete_old_files.ps1

$oldFiles = @(
  "database\migrations\2026_09_27_060101_add_username_to_users_table.php",
  "database\migrations\2026_09_27_060714_add_registration_names_to_users_table.php",
  "database\migrations\2026_09_27_065326_add_is_banned_to_users_table.php",
  "database\migrations\2026_10_05_020243_add_expo_push_token_to_users_table.php",
  "database\seeders\UpdateMapBuildingsAndRoomsSeeder.php",
  "app\Support\PushNotifier.php",
  "app\Services\ExpoPushNotificationService.php",
  "app\Notifications\NewComplaintNotification.php",
  "app\Notifications\NewDamageReportNotification.php",
  "app\Notifications\ReportStatusNotification.php",
  "app\Http\Controllers\Api\AdminRoomReportController.php",
  "school_reporting"
)

foreach ($file in $oldFiles) {
  if (Test-Path $file) {
    Remove-Item $file -Force
    Write-Host "Deleted:      $file" -ForegroundColor Green
  } else {
    Write-Host "Already gone: $file" -ForegroundColor DarkGray
  }
}

# remove folders that are now empty
foreach ($folder in @("app\Notifications", "app\Services")) {
  if ((Test-Path $folder) -and -not (Get-ChildItem $folder -Force)) {
    Remove-Item $folder
    Write-Host "Removed empty folder: $folder" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Done. Next: php artisan config:clear ; php artisan migrate:fresh --seed" -ForegroundColor Cyan
