class InMemoryDb {
  constructor() {
    this.rides = new Map();
    this.memories = new Map();
  }

  // ---------- Rides ----------
  insertRide(ride) {
    this.rides.set(ride.id, ride);
    return ride;
  }

  updateRide(rideId, updater) {
    const existing = this.rides.get(rideId);
    if (!existing) return null;
    const next = updater(existing);
    this.rides.set(rideId, next);
    return next;
  }

  getRide(rideId) {
    return this.rides.get(rideId) ?? null;
  }

  listRideSummaries() {
    return Array.from(this.rides.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map(r => ({
        id: r.id,
        type: r.type,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        distanceMeters: r.metrics.distanceMeters,
        durationMs: r.metrics.durationMs,
        startLocationLabel: r.startLocationLabel,
        endLocationLabel: r.endLocationLabel,
        memoryCount: r.memoryIds.length,
      }));
  }

  // ---------- Memories ----------
  insertMemory(memory) {
    this.memories.set(memory.id, memory);
    const ride = this.rides.get(memory.rideId);
    if (ride && !ride.memoryIds.includes(memory.id)) {
      this.rides.set(ride.id, {...ride, memoryIds: [...ride.memoryIds, memory.id]});
    }
    return memory;
  }

  deleteMemory(memoryId) {
    const m = this.memories.get(memoryId);
    if (!m) return false;
    this.memories.delete(memoryId);
    const ride = this.rides.get(m.rideId);
    if (ride) {
      this.rides.set(ride.id, {
        ...ride,
        memoryIds: ride.memoryIds.filter(id => id !== memoryId),
      });
    }
    return true;
  }

  listMemoriesForRide(rideId) {
    return Array.from(this.memories.values())
      .filter(m => m.rideId === rideId)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  }

  reset() {
    this.rides.clear();
    this.memories.clear();
  }
}

export const mockDb = new InMemoryDb();
