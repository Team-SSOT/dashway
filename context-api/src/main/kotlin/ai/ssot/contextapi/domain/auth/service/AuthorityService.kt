package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.dto.AuthorityDto
import ai.ssot.contextapi.domain.auth.entity.Authority
import ai.ssot.contextapi.domain.auth.repository.AuthorityRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthorityService(
    private val authorityRepository: AuthorityRepository
) {
    @Transactional(readOnly = true)
    fun getAllDtos(): List<AuthorityDto> {
        return authorityRepository.findAllByOrderByIdAsc()
            .map {
                AuthorityDto(
                    id = it.id!!,
                    name = it.name
                )
            }
    }

    @Transactional(readOnly = true)
    fun getAllDtoByMemberId(memberId: Long): List<AuthorityDto> {
        return authorityRepository.findAllByMemberId(memberId)
            .map {
                AuthorityDto(
                    id = it.id!!,
                    name = it.name
                )
            }
    }

    fun getAllByIds(ids: List<Int>): List<Authority> {
        return authorityRepository.findAllById(ids)
    }
}
