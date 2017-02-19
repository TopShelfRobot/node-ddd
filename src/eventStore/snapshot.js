

const Snapshot = {
  getVersion() {
    return this.version;
  },
  getData() {
    return this.state;
  }
}

SnapshotPrototype = Snapshot;

export default function CreateSnapshot(options={}) {
  const snapshot = Object.create(SnapshotPrototype);

  snapshot.aggergateId = options.aggergateId;
  snapshot.aggregateType = options.aggregateType;
  snapshot.version = options.version;
  snapshot.state = options.state;

  return snapshot;
}
