import React, { useState } from "react";
import AdvertorialsList from "./AdvertorialsList";
import AdvertorialEdit from "./AdvertorialEdit";

export default function Advertorials() {
  const [editing, setEditing] = useState(null); // null = list, {} = new, {...} = existing

  if (editing !== null) {
    return (
      <AdvertorialEdit
        advertorial={editing.id ? editing : null}
        onBack={() => setEditing(null)}
      />
    );
  }

  return (
    <AdvertorialsList
      onEdit={(adv) => setEditing(adv)}
      onCreate={() => setEditing({})}
    />
  );
}