package com.example.ems.dto;

import com.example.ems.model.LeaveStatus;
import com.example.ems.model.LeaveType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveDtos {

    public static class LeaveResponse {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private String employeeCode;
        private String departmentName;
        private LeaveType leaveType;
        private LocalDate startDate;
        private LocalDate endDate;
        private long days;
        private String reason;
        private LeaveStatus status;
        private LocalDateTime appliedOn;
        private String reviewedBy;
        private LocalDateTime reviewedOn;
        private String reviewComment;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public LeaveType getLeaveType() { return leaveType; }
        public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public long getDays() { return days; }
        public void setDays(long days) { this.days = days; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public LeaveStatus getStatus() { return status; }
        public void setStatus(LeaveStatus status) { this.status = status; }
        public LocalDateTime getAppliedOn() { return appliedOn; }
        public void setAppliedOn(LocalDateTime appliedOn) { this.appliedOn = appliedOn; }
        public String getReviewedBy() { return reviewedBy; }
        public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
        public LocalDateTime getReviewedOn() { return reviewedOn; }
        public void setReviewedOn(LocalDateTime reviewedOn) { this.reviewedOn = reviewedOn; }
        public String getReviewComment() { return reviewComment; }
        public void setReviewComment(String reviewComment) { this.reviewComment = reviewComment; }
    }

    public static class LeaveCreateRequest {
        @NotNull(message = "Employee is required")
        private Long employeeId;
        @NotNull(message = "Leave type is required")
        private com.example.ems.model.LeaveType leaveType;
        @NotNull(message = "Start date is required")
        private LocalDate startDate;
        @NotNull(message = "End date is required")
        private LocalDate endDate;
        private String reason;

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public com.example.ems.model.LeaveType getLeaveType() { return leaveType; }
        public void setLeaveType(com.example.ems.model.LeaveType leaveType) { this.leaveType = leaveType; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class LeaveReviewRequest {
        @NotNull(message = "Decision is required")
        private LeaveStatus status; // APPROVED or REJECTED
        private String comment;

        public LeaveStatus getStatus() { return status; }
        public void setStatus(LeaveStatus status) { this.status = status; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }
}
