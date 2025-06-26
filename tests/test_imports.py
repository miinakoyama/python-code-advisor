from pathlib import Path


def test_backend_exists():
    assert Path('backend/main.py').exists()
