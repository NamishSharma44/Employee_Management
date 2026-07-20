package com.example.ems.dto;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;
        @NotBlank(message = "Password is required")
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String token;
        private String username;
        private String role;
        private Long employeeId;
        private String fullName;

        public LoginResponse(String token, String username, String role, Long employeeId, String fullName) {
            this.token = token;
            this.username = username;
            this.role = role;
            this.employeeId = employeeId;
            this.fullName = fullName;
        }

        public String getToken() { return token; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
        public Long getEmployeeId() { return employeeId; }
        public String getFullName() { return fullName; }
    }
}
