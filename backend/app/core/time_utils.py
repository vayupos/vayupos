from datetime import datetime

def is_item_available(item):
    """
    Check if an item (Product or DishTemplate) is available based on time restrictions.
    """
    if not getattr(item, 'is_time_restricted', False):
        return True

    available_from = getattr(item, 'available_from', None)
    available_to = getattr(item, 'available_to', None)

    if available_from is None or available_to is None:
        return True

    current_time = datetime.now().time()

    if available_from <= available_to:
        # Standard day: e.g., 06:00 to 11:00
        return available_from <= current_time <= available_to
    else:
        # Overnight: e.g., 22:00 to 04:00
        return current_time >= available_from or current_time <= available_to
