package com.example.ems.repository;

import com.example.ems.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("""
    SELECT u
    FROM User u
    LEFT JOIN FETCH u.employee
    WHERE LOWER(u.username) = LOWER(:username)
    """)
    Optional<User> findByUsernameIgnoreCase(@Param("username") String username);
    boolean existsByUsernameIgnoreCase(String username);
}
