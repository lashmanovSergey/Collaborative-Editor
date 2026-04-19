class UserSettings:
    def __init__(self):
        self.username_min_length = 3
        self.username_max_length = 12
        self.password_min_length = 5
        self.password_max_length = 32

user_settings = UserSettings()