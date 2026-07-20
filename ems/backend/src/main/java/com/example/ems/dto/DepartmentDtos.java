package com.example.ems.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentDtos {

    public static class DepartmentResponse {
        private Long id;
        private String name;
        private String description;
        private String location;
        private Long headId;
        private String headName;
        private long employeeCount;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public Long getHeadId() { return headId; }
        public void setHeadId(Long headId) { this.headId = headId; }
        public String getHeadName() { return headName; }
        public void setHeadName(String headName) { this.headName = headName; }
        public long getEmployeeCount() { return employeeCount; }
        public void setEmployeeCount(long employeeCount) { this.employeeCount = employeeCount; }
    }

    public static class DepartmentRequest {
        @NotBlank(message = "Department name is required")
        private String name;
        private String description;
        private String location;
        private Long headId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public Long getHeadId() { return headId; }
        public void setHeadId(Long headId) { this.headId = headId; }
    }
}
