package com.example.ems.service;

import com.example.ems.dto.DashboardStats;
import com.example.ems.model.Employee;
import com.example.ems.model.EmployeeStatus;
import com.example.ems.model.LeaveStatus;
import com.example.ems.repository.DepartmentRepository;
import com.example.ems.repository.EmployeeRepository;
import com.example.ems.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeService employeeService;

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    public DashboardService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository,
                             LeaveRequestRepository leaveRequestRepository, EmployeeService employeeService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeService = employeeService;
    }

    public DashboardStats getStats() {
        List<Employee> all = employeeRepository.findAll();
        DashboardStats stats = new DashboardStats();

        stats.setTotalEmployees(all.size());
        stats.setTotalDepartments(departmentRepository.count());
        stats.setActiveCount(all.stream().filter(e -> e.getStatus() == EmployeeStatus.ACTIVE).count());
        stats.setOnLeaveCount(all.stream().filter(e -> e.getStatus() == EmployeeStatus.ON_LEAVE).count());
        stats.setTerminatedCount(all.stream().filter(e -> e.getStatus() == EmployeeStatus.TERMINATED).count());
        stats.setAverageSalary(all.stream().mapToDouble(e -> e.getSalary() != null ? e.getSalary() : 0.0)
                .average().orElse(0.0));
        stats.setPendingLeaveRequests(leaveRequestRepository.countByStatus(LeaveStatus.PENDING));

        Map<String, Long> headcount = all.stream()
                .filter(e -> e.getDepartment() != null)
                .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), LinkedHashMap::new, Collectors.counting()));
        stats.setHeadcountByDepartment(headcount);

        Map<String, Long> gender = all.stream()
                .filter(e -> e.getGender() != null)
                .collect(Collectors.groupingBy(e -> e.getGender().name(), LinkedHashMap::new, Collectors.counting()));
        stats.setGenderDistribution(gender);

        Map<String, Long> salaryBands = new LinkedHashMap<>();
        salaryBands.put("Under $50K", 0L);
        salaryBands.put("$50K - $75K", 0L);
        salaryBands.put("$75K - $100K", 0L);
        salaryBands.put("$100K - $150K", 0L);
        salaryBands.put("Above $150K", 0L);
        for (Employee e : all) {
            double s = e.getSalary() != null ? e.getSalary() : 0;
            String band = s < 50000 ? "Under $50K" : s < 75000 ? "$50K - $75K" : s < 100000 ? "$75K - $100K"
                    : s < 150000 ? "$100K - $150K" : "Above $150K";
            salaryBands.merge(band, 1L, Long::sum);
        }
        stats.setSalaryBands(salaryBands);

        Map<String, Long> hiringTrend = all.stream()
                .filter(e -> e.getDateOfJoining() != null)
                .collect(Collectors.groupingBy(e -> e.getDateOfJoining().format(MONTH_FORMAT),
                        LinkedHashMap::new, Collectors.counting()));
        Map<String, Long> sortedTrend = hiringTrend.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
        stats.setHiringTrend(sortedTrend);

        stats.setRecentHires(all.stream()
                .filter(e -> e.getDateOfJoining() != null)
                .sorted(Comparator.comparing(Employee::getDateOfJoining).reversed())
                .limit(5)
                .map(employeeService::toResponse)
                .toList());

        return stats;
    }
}
