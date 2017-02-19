
const CommandPrototype = {};


export default function CreateCommand(name, commandVersion, payload, meta) {
  if (!name) { throw new Error('Cannot create a command without a name'); }
  if (!commandVersion) { throw new Error('Cannot create a command without a commandVersion'); }
  if (!payload) { throw new Error('Cannot create a command without a payload'); }
  if (!meta) { throw new Error('Cannot create a command without a meta'); }

  const command = Object.create(CommandPrototype);
  Object.assign(command, {name, commandVersion, payload, meta});

  return command;
}
