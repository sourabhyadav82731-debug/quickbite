"use client";

export default function FavoritesPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Favorites</h1>
      <div className="glass-card p-10 text-center opacity-60 text-sm">
        Favorites are stored locally in this build — tap the heart on a restaurant to save it
        here. Syncing favorites to your account is planned for a future pass.
      </div>
    </div>
  );
}
