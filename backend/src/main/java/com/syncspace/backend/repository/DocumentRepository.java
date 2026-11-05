
package com.syncspace.backend.repository;

import com.syncspace.backend.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByOwnerId(Long ownerId);

    Optional<Document> findByIdAndOwnerId(Long id, Long ownerId);

}
