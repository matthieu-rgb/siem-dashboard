import os

# Set safe test env before any app imports so validators pass
os.environ.setdefault("SECRET_KEY", "test-secret-key-at-least-32-chars-long-ok")
os.environ.setdefault("DEBUG", "true")
