from collections import defaultdict
from datetime import UTC, datetime, timedelta


class RateLimiter:
    """In-memory sliding-window rate limiter. Safe for single-process async."""

    def __init__(self, max_calls: int, period_seconds: int) -> None:
        self._max = max_calls
        self._period = timedelta(seconds=period_seconds)
        self._calls: defaultdict[str, list[datetime]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = datetime.now(UTC)
        cutoff = now - self._period
        self._calls[key] = [t for t in self._calls[key] if t > cutoff]
        if len(self._calls[key]) >= self._max:
            return False
        self._calls[key].append(now)
        return True


login_limiter = RateLimiter(max_calls=5, period_seconds=900)
