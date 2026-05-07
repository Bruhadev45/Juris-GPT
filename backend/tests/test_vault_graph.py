import json
from datetime import datetime, timezone


def _vault_doc(doc_id: str, file_name: str, category: str, tags: list[str], description: str = ""):
    return {
        "id": doc_id,
        "file_name": file_name,
        "stored_name": f"{doc_id}.txt",
        "file_size": 1200,
        "file_type": "text/plain",
        "category": category,
        "tags": tags,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "description": description,
    }


def test_vault_graph_builds_document_tag_category_and_reference_edges(client, tmp_path, monkeypatch):
    from app.routes import vault

    meta_file = tmp_path / "vault_documents.json"
    files_dir = tmp_path / "vault_files"
    docs = [
        _vault_doc(
            "doc-a",
            "Founder Agreement.txt",
            "Agreements",
            ["equity", "founders"],
            "References [[Cap Table]] for ownership details.",
        ),
        _vault_doc("doc-b", "Cap Table.txt", "Corporate", ["equity"]),
    ]
    meta_file.write_text(json.dumps(docs))

    monkeypatch.setattr(vault, "VAULT_META_FILE", meta_file)
    monkeypatch.setattr(vault, "VAULT_FILES_DIR", files_dir)

    response = client.get("/api/vault/graph")

    assert response.status_code == 200
    graph = response.json()["data"]
    assert graph["stats"]["documents"] == 2
    assert graph["stats"]["tags"] == 2
    assert graph["stats"]["categories"] == 2

    node_ids = {node["id"] for node in graph["nodes"]}
    assert {"doc:doc-a", "doc:doc-b", "tag:equity", "category:agreements"} <= node_ids

    edge_types = {(edge["source"], edge["target"], edge["type"]) for edge in graph["edges"]}
    assert ("doc:doc-a", "doc:doc-b", "reference") in edge_types
    assert ("doc:doc-a", "doc:doc-b", "shared_tag") in edge_types
    assert ("doc:doc-a", "tag:equity", "tag") in edge_types


def test_vault_graph_respects_category_filter(client, tmp_path, monkeypatch):
    from app.routes import vault

    meta_file = tmp_path / "vault_documents.json"
    files_dir = tmp_path / "vault_files"
    docs = [
        _vault_doc("doc-a", "NDA.txt", "Agreements", ["confidentiality"]),
        _vault_doc("doc-b", "GST Return.txt", "Tax", ["filing"]),
    ]
    meta_file.write_text(json.dumps(docs))

    monkeypatch.setattr(vault, "VAULT_META_FILE", meta_file)
    monkeypatch.setattr(vault, "VAULT_FILES_DIR", files_dir)

    response = client.get("/api/vault/graph?category=Tax")

    assert response.status_code == 200
    graph = response.json()["data"]
    document_labels = {
        node["label"]
        for node in graph["nodes"]
        if node["type"] == "document"
    }
    assert document_labels == {"GST Return.txt"}


def test_vault_document_links_include_outgoing_backlinks_and_related_docs(client, tmp_path, monkeypatch):
    from app.routes import vault

    meta_file = tmp_path / "vault_documents.json"
    files_dir = tmp_path / "vault_files"
    docs = [
        _vault_doc("doc-a", "Founder Agreement.txt", "Agreements", ["equity"], "See [[Cap Table]]."),
        _vault_doc("doc-b", "Cap Table.txt", "Corporate", ["equity"], "Supports [[Founder Agreement|founder docs]]."),
        _vault_doc("doc-c", "GST Return.txt", "Tax", ["filing"]),
    ]
    meta_file.write_text(json.dumps(docs))

    monkeypatch.setattr(vault, "VAULT_META_FILE", meta_file)
    monkeypatch.setattr(vault, "VAULT_FILES_DIR", files_dir)

    response = client.get("/api/vault/doc-a/links")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["outgoing_links"][0]["document"]["id"] == "doc-b"
    assert data["backlinks"][0]["source"]["id"] == "doc-b"
    assert data["related_documents"][0]["document"]["id"] == "doc-b"


def test_vault_metadata_update_changes_graph_inputs(client, tmp_path, monkeypatch, bypass_csrf):
    from app.routes import vault

    meta_file = tmp_path / "vault_documents.json"
    files_dir = tmp_path / "vault_files"
    docs = [_vault_doc("doc-a", "NDA.txt", "Agreements", ["draft"])]
    meta_file.write_text(json.dumps(docs))

    monkeypatch.setattr(vault, "VAULT_META_FILE", meta_file)
    monkeypatch.setattr(vault, "VAULT_FILES_DIR", files_dir)

    response = client.patch(
        "/api/vault/doc-a/metadata",
        json={
            "category": "Contracts",
            "tags": ["final", "signed"],
            "description": "Final copy linked to [[Board Minutes]].",
        },
    )

    assert response.status_code == 200
    updated = response.json()["data"]
    assert updated["category"] == "Contracts"
    assert updated["tags"] == ["final", "signed"]
    assert updated["description"] == "Final copy linked to [[Board Minutes]]."


def test_vault_link_suggestions_returns_document_titles(client, tmp_path, monkeypatch):
    from app.routes import vault

    meta_file = tmp_path / "vault_documents.json"
    files_dir = tmp_path / "vault_files"
    docs = [
        _vault_doc("doc-a", "Founder Agreement.txt", "Agreements", ["equity"]),
        _vault_doc("doc-b", "Cap Table.txt", "Corporate", ["equity"]),
    ]
    meta_file.write_text(json.dumps(docs))

    monkeypatch.setattr(vault, "VAULT_META_FILE", meta_file)
    monkeypatch.setattr(vault, "VAULT_FILES_DIR", files_dir)

    response = client.get("/api/vault/link-suggestions?q=cap")

    assert response.status_code == 200
    suggestions = response.json()["data"]
    assert suggestions == [
        {
            "id": "doc-b",
            "title": "Cap Table",
            "file_name": "Cap Table.txt",
            "category": "Corporate",
        }
    ]
