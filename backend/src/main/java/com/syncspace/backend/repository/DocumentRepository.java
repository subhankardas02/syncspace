package com.syncspace.backend.repository;

import com.syncspace.backend.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {

}
