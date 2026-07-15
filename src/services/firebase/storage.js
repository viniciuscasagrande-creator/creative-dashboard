// Storage module placeholder
export const uploadFile = async (file, path) => {
  console.log("Storage: simulated upload for", file.name, "to", path);
  return `https://firebasestorage.googleapis.com/v0/b/mock/o/${encodeURIComponent(path)}`;
};
