package com.example.ems.dto;

import java.util.List;
import java.util.Map;

public class DashboardStats {
    private long totalEmployees;
    private long totalDepartments;
    private long activeCount;
    private long onLeaveCount;
    private long terminatedCount;
    private double averageSalary;
    private long pendingLeaveRequests;
    private Map<String, Long> headcountByDepartment;
    private Map<String, Long> genderDistribution;
    private Map<String, Long> salaryBands;
    private Map<String, Long> hiringTrend; // "YYYY-MM" -> count
    private List<EmployeeResponse> recentHires;

    public long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(long totalEmployees) { this.totalEmployees = totalEmployees; }
    public long getTotalDepartments() { return totalDepartments; }
    public void setTotalDepartments(long totalDepartments) { this.totalDepartments = totalDepartments; }
    public long getActiveCount() { return activeCount; }
    public void setActiveCount(long activeCount) { this.activeCount = activeCount; }
    public long getOnLeaveCount() { return onLeaveCount; }
    public void setOnLeaveCount(long onLeaveCount) { this.onLeaveCount = onLeaveCount; }
    public long getTerminatedCount() { return terminatedCount; }
    public void setTerminatedCount(long terminatedCount) { this.terminatedCount = terminatedCount; }
    public double getAverageSalary() { return averageSalary; }
    public void setAverageSalary(double averageSalary) { this.averageSalary = averageSalary; }
    public long getPendingLeaveRequests() { return pendingLeaveRequests; }
    public void setPendingLeaveRequests(long pendingLeaveRequests) { this.pendingLeaveRequests = pendingLeaveRequests; }
    public Map<String, Long> getHeadcountByDepartment() { return headcountByDepartment; }
    public void setHeadcountByDepartment(Map<String, Long> headcountByDepartment) { this.headcountByDepartment = headcountByDepartment; }
    public Map<String, Long> getGenderDistribution() { return genderDistribution; }
    public void setGenderDistribution(Map<String, Long> genderDistribution) { this.genderDistribution = genderDistribution; }
    public Map<String, Long> getSalaryBands() { return salaryBands; }
    public void setSalaryBands(Map<String, Long> salaryBands) { this.salaryBands = salaryBands; }
    public Map<String, Long> getHiringTrend() { return hiringTrend; }
    public void setHiringTrend(Map<String, Long> hiringTrend) { this.hiringTrend = hiringTrend; }
    public List<EmployeeResponse> getRecentHires() { return recentHires; }
    public void setRecentHires(List<EmployeeResponse> recentHires) { this.recentHires = recentHires; }
}
